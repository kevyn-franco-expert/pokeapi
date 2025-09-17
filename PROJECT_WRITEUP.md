# Pokédex Chatbot – Project Writeup

## Design Decisions
- Direct integration with Claude’s API for full control over streaming  
- **SSE** for real-time responses and a **modular tool system** for easy feature expansion  
- Stack: **Next.js 14**, **TypeScript**, **Tailwind CSS**, plain HTTP calls  

## Challenges & Solutions
- **Streaming + Tools**: combined AI text flow with PokéAPI calls using state tracking and progressive parsing  
- **Real-time UI**: optimized updates with React hooks, efficient concatenation, smooth auto-scroll  
- **PokéAPI**: unified multiple endpoints and normalized data  
- **Team Analysis**: added type effectiveness, weaknesses, and strategic recommendations  

## 1-Month Roadmap
- **Week 1**: caching, rate limiting, monitoring  
- **Week 2**: advanced search, move data, evolution chains  
- **Week 3**: persistent history, export/share features, responsive design, dark mode  
- **Week 4**: battle simulator, team builder, competitive insights  

## Future
- User accounts and saved teams  
- Community features (share/rate teams)  
- Tournament mode  
- Game save integration  
- Advanced analytics for competitive play