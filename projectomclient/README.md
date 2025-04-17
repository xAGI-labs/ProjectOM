# ProjectOM

ProjectOM is a web interface for OpenManus, an AI-powered tool for browser automation.

## Project Structure

- `/OpenManus`: Backend Python project providing AI-powered browser automation
- `/projectomclient`: Frontend Next.js application for interacting with the backend

## Getting Started

### Running the Backend

1. Navigate to the OpenManus directory:

```bash
cd /home/blizzy/Development/xAGI/projectom/OpenManus
```

2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

3. Start the server:

```bash
python app/mcp/server.py --host 0.0.0.0 --port 8000
```

### Running the Frontend

1. Navigate to the projectomclient directory:

```bash
cd /home/blizzy/Development/xAGI/projectom/projectomclient
```

2. Install the required dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Enter a prompt in the input field at the bottom of the screen.
2. Press Send or hit Enter to submit your prompt.
3. The system will process your request and display the results when they are ready.

## Technical Information

- The frontend uses Next.js with TypeScript and TailwindCSS
- The backend uses FastAPI with Python
- Communication between the frontend and backend happens via REST API
