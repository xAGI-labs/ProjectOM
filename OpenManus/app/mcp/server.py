import logging
import sys
import os

# Add the project root to the Python path to make imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
if project_root not in sys.path:
    sys.path.append(project_root)

# Now the imports should work
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import asyncio
import argparse
import atexit
import json
from inspect import Parameter, Signature
from typing import Any, Dict, Optional, List, Union
import io
import contextlib

# Import main functionalities
from mcp.server.fastmcp import FastMCP

# Import app modules after fixing the path
from app.logger import logger
from app.tool.base import BaseTool
from app.tool.bash import Bash
from app.tool.browser_use_tool import BrowserUseTool
from app.tool.str_replace_editor import StrReplaceEditor
from app.tool.terminate import Terminate

# Import the actual agent processing logic - corrected import
from app.agent.manus import Manus  # Import Manus agent which handles browser automation
from app.llm import LLM

# Setup logging
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stderr)])

# Create FastAPI app
app = FastAPI(title="OpenManus API", description="API for the OpenManus browser automation tool")

# Add CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request model
class PromptRequest(BaseModel):
    prompt: str

# Define response model
class PromptResponse(BaseModel):
    status: str
    message: str
    results: Optional[str] = None

# Store active tasks
active_tasks = {}

class MCPServer:
    """MCP Server implementation with tool registration and management."""

    def __init__(self, name: str = "openmanus"):
        self.server = FastMCP(name)
        self.tools: Dict[str, BaseTool] = {}

        # Initialize standard tools
        self.tools["bash"] = Bash()
        self.tools["browser"] = BrowserUseTool()
        self.tools["editor"] = StrReplaceEditor()
        self.tools["terminate"] = Terminate()

    def register_tool(self, tool: BaseTool, method_name: Optional[str] = None) -> None:
        """Register a tool with parameter validation and documentation."""
        tool_name = method_name or tool.name
        tool_param = tool.to_param()
        tool_function = tool_param["function"]

        # Define the async function to be registered
        async def tool_method(**kwargs):
            logger.info(f"Executing {tool_name}: {kwargs}")
            result = await tool.execute(**kwargs)

            logger.info(f"Result of {tool_name}: {result}")

            # Handle different types of results (match original logic)
            if hasattr(result, "model_dump"):
                return json.dumps(result.model_dump())
            elif isinstance(result, dict):
                return json.dumps(result)
            return result

        # Set method metadata
        tool_method.__name__ = tool_name
        tool_method.__doc__ = self._build_docstring(tool_function)
        tool_method.__signature__ = self._build_signature(tool_function)

        # Store parameter schema (important for tools that access it programmatically)
        param_props = tool_function.get("parameters", {}).get("properties", {})
        required_params = tool_function.get("parameters", {}).get("required", [])
        tool_method._parameter_schema = {
            param_name: {
                "description": param_details.get("description", ""),
                "type": param_details.get("type", "any"),
                "required": param_name in required_params,
            }
            for param_name, param_details in param_props.items()
        }

        # Register with server
        self.server.tool()(tool_method)
        logger.info(f"Registered tool: {tool_name}")

    def _build_docstring(self, tool_function: dict) -> str:
        """Build a formatted docstring from tool function metadata."""
        description = tool_function.get("description", "")
        param_props = tool_function.get("parameters", {}).get("properties", {})
        required_params = tool_function.get("parameters", {}).get("required", [])

        # Build docstring (match original format)
        docstring = description
        if param_props:
            docstring += "\n\nParameters:\n"
            for param_name, param_details in param_props.items():
                required_str = (
                    "(required)" if param_name in required_params else "(optional)"
                )
                param_type = param_details.get("type", "any")
                param_desc = param_details.get("description", "")
                docstring += (
                    f"    {param_name} ({param_type}) {required_str}: {param_desc}\n"
                )

        return docstring

    def _build_signature(self, tool_function: dict) -> Signature:
        """Build a function signature from tool function metadata."""
        param_props = tool_function.get("parameters", {}).get("properties", {})
        required_params = tool_function.get("parameters", {}).get("required", [])

        parameters = []

        # Follow original type mapping
        for param_name, param_details in param_props.items():
            param_type = param_details.get("type", "")
            default = Parameter.empty if param_name in required_params else None

            # Map JSON Schema types to Python types (same as original)
            annotation = Any
            if param_type == "string":
                annotation = str
            elif param_type == "integer":
                annotation = int
            elif param_type == "number":
                annotation = float
            elif param_type == "boolean":
                annotation = bool
            elif param_type == "object":
                annotation = dict
            elif param_type == "array":
                annotation = list

            # Create parameter with same structure as original
            param = Parameter(
                name=param_name,
                kind=Parameter.KEYWORD_ONLY,
                default=default,
                annotation=annotation,
            )
            parameters.append(param)

        return Signature(parameters=parameters)

    async def cleanup(self) -> None:
        """Clean up server resources."""
        logger.info("Cleaning up resources")
        # Follow original cleanup logic - only clean browser tool
        if "browser" in self.tools and hasattr(self.tools["browser"], "cleanup"):
            await self.tools["browser"].cleanup()

    def register_all_tools(self) -> None:
        """Register all tools with the server."""
        for tool in self.tools.values():
            self.register_tool(tool)

    def run(self, transport: str = "stdio") -> None:
        """Run the MCP server."""
        # Register all tools
        self.register_all_tools()

        # Register cleanup function (match original behavior)
        atexit.register(lambda: asyncio.run(self.cleanup()))

        # Start server (with same logging as original)
        logger.info(f"Starting OpenManus server ({transport} mode)")
        self.server.run(transport=transport)


# Instance of the server
server = MCPServer()

@app.post("/api/prompt", response_model=PromptResponse)
async def process_prompt(request: PromptRequest, background_tasks: BackgroundTasks):
    """Process a prompt from the frontend."""
    try:
        logger.info(f"Received prompt: {request.prompt}")
        
        # Add the task to background processing
        task_id = f"task_{len(active_tasks) + 1}"
        
        # In a real implementation, you would call your processing logic here
        # For now, we'll just log and return a mock response
        active_tasks[task_id] = {
            "prompt": request.prompt,
            "status": "processing"
        }
        
        # Start processing in the background
        background_tasks.add_task(process_in_background, task_id, request.prompt)
        
        return PromptResponse(
            status="success",
            message=f"Prompt received and processing started with ID: {task_id}",
        )
    except Exception as e:
        logger.error(f"Error processing prompt: {str(e)}")
        return PromptResponse(status="error", message=f"Error: {str(e)}")

class TaskOutput:
    """Class to capture stdout/stderr for task output."""
    def __init__(self):
        self.buffer = io.StringIO()
        self.logs = []
        
    def write(self, text):
        self.buffer.write(text)
        self.logs.append(text)
        
    def flush(self):
        self.buffer.flush()
    
    def get_output(self):
        return self.buffer.getvalue()

    def get_logs(self):
        return self.logs

async def process_in_background(task_id: str, prompt: str):
    """Process the prompt in the background using OpenManus."""
    task_output = TaskOutput()
    try:
        logger.info(f"Processing task {task_id}: {prompt}")
        active_tasks[task_id]["status"] = "processing"
        active_tasks[task_id]["logs"] = []
        
        # Create an instance of the Manus agent instead of non-existent Agent class
        llm = LLM()
        agent = Manus(llm=llm)  # Using Manus agent which handles browser automation
        
        # Redirect stdout/stderr to capture output
        with contextlib.redirect_stdout(task_output), contextlib.redirect_stderr(task_output):
            # Process the prompt with OpenManus
            logger.warning(f"Processing your request...")
            
            # Run the agent on the prompt
            result = await agent.run(prompt)
            
            # Capture the final output
            final_output = task_output.get_output()
            
        # Store results
        active_tasks[task_id]["status"] = "completed"
        active_tasks[task_id]["result"] = final_output
        active_tasks[task_id]["logs"] = task_output.get_logs()
        
        logger.info(f"Completed task {task_id}")
    except Exception as e:
        logger.error(f"Background task error for {task_id}: {str(e)}")
        active_tasks[task_id]["status"] = "error"
        active_tasks[task_id]["error"] = str(e)
        active_tasks[task_id]["logs"] = task_output.get_logs()

@app.get("/api/tasks/{task_id}", response_model=PromptResponse)
async def get_task_status(task_id: str):
    """Get the status of a specific task."""
    if task_id not in active_tasks:
        return PromptResponse(status="error", message="Task not found")
    
    task = active_tasks[task_id]
    if task["status"] == "completed":
        return PromptResponse(
            status="success",
            message="Task completed",
            results=task.get("result", "No results available")
        )
    elif task["status"] == "error":
        return PromptResponse(
            status="error",
            message=f"Task failed: {task.get('error', 'Unknown error')}",
            results="\n".join(task.get("logs", []))
        )
    else:
        # If task is still processing, return the logs so far
        return PromptResponse(
            status="processing", 
            message="Task is still processing",
            results="\n".join(task.get("logs", []))
        )

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Run the OpenManus server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind the server to")
    parser.add_argument("--transport", type=str, default="http", help="Transport protocol")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    
    # Start the FastAPI server
    logger.info(f"Starting OpenManus API server on {args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)
