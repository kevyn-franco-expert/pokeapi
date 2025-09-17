import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { tools, executeTool } from '@/lib/tools'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const systemPrompt = `You are a helpful Pokédex AI assistant with access to real-time Pokémon data. You can:

1. Look up detailed information about any Pokémon using the get_pokemon_info tool
2. Analyze Pokémon teams for strategic insights using the analyze_pokemon_team tool

When users ask about specific Pokémon, always use the get_pokemon_info tool to get accurate, up-to-date information. When they ask about team composition or strategy, use the analyze_pokemon_team tool.

Be enthusiastic about Pokémon and provide helpful, detailed responses. If users ask general questions about Pokémon without needing specific data, you can answer from your knowledge, but always prefer using tools when specific Pokémon information is requested.`

          const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
              {
                role: 'user',
                content: message
              }
            ],
            tools: tools,
            stream: true
          })

          let pendingToolUse: any = null
          let toolInput = ''

          for await (const chunk of response) {
            try {
              if (chunk.type === 'content_block_start') {
                if (chunk.content_block.type === 'tool_use') {
                  pendingToolUse = {
                    id: chunk.content_block.id,
                    name: chunk.content_block.name
                  }
                  toolInput = ''
                }
              } else if (chunk.type === 'content_block_delta') {
                if (chunk.delta.type === 'text_delta') {
                  const content = chunk.delta.text
                  const data = JSON.stringify({ content })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                } else if (chunk.delta.type === 'input_json_delta') {
                  toolInput += chunk.delta.partial_json || ''
                }
              } else if (chunk.type === 'content_block_stop') {
                if (pendingToolUse && toolInput) {
                  try {
                    const parsedInput = JSON.parse(toolInput)
                    const toolResult = await executeTool(pendingToolUse.name, parsedInput)
                    
                    const words = toolResult.content.split(' ')
                    for (let i = 0; i < words.length; i++) {
                      const word = i === 0 ? words[i] : ' ' + words[i]
                      const data = JSON.stringify({ content: word })
                      controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                      await new Promise(resolve => setTimeout(resolve, 30))
                    }
                    
                    pendingToolUse = null
                    toolInput = ''
                  } catch (error) {
                    const errorMsg = `\n\nError: ${error}`
                    const data = JSON.stringify({ content: errorMsg })
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                  }
                }
              }
            } catch (error) {
              console.error('Chunk processing error:', error)
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          const errorContent = `Sorry, I encountered an error: ${error}`
          const data = JSON.stringify({ content: errorContent })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}