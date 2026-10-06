# Wokeometer

A vanilla HTML/CSS/JavaScript MVP that asks controversial questions, mixes in open-ended essay questions, and uses Groq's `openai/gpt-oss-120b` to analyze the complete response pattern.

## Requirements

- Node.js 20.6+ (uses Node's built-in `--env-file`)
- A Groq API key

## Run

```bash
cp .env.example .env
# Put your GROQ_API_KEY in .env

npm start
```

Then open:

http://localhost:3000

## Important

The Groq API key stays on the server. Never put it in browser JavaScript.

The MVP does not store quiz answers. The browser sends the completed quiz once to `/api/analyze`, the server sends it to Groq, returns the result, and the session is discarded.

## Model

Default:
`openai/gpt-oss-120b`

Groq's current documentation lists GPT-OSS 120B as supporting JSON Schema structured outputs and a 131,072-token context window.

## Production TODO

- Add persistent database storage only if needed.
- Add abuse/rate limiting at the edge.
- Add analytics without storing sensitive free-text answers by default.
- Add question versioning.
- Add a proper share-image generator.
- Calibrate the score against human-labelled response sets.
