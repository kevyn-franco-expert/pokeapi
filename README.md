# Pokédex AI Chatbot

AI-powered Pokédex chatbot with real-time streaming responses using Next.js and Anthropic's Claude API.

## Features

- **Real-time Streaming**: Direct Anthropic API integration with Server-Sent Events
- **PokéAPI Integration**: Detailed Pokémon information (stats, types, abilities)
- **Team Analysis**: Analyze Pokémon teams for weaknesses and recommendations
- **No Vercel AI SDK**: Direct API integration as required

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`

## Usage

- **Pokémon Info**: "Tell me about Pikachu"
- **Team Analysis**: "Analyze my team: Charizard, Blastoise, Venusaur"

## Architecture

- **Frontend**: Next.js 14 with streaming chat interface
- **Backend**: Direct Anthropic Claude API with tool integration
- **Tools**: PokéAPI integration + custom team analyzer
- **Streaming**: Server-Sent Events for real-time responses