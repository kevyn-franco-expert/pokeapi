export interface Tool {
  name: string
  description: string
  input_schema: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}

export interface ToolResult {
  content: string
  is_error?: boolean
}

export const tools: Tool[] = [
  {
    name: "get_pokemon_info",
    description: "Get detailed information about a specific Pokémon including stats, types, abilities, and moves",
    input_schema: {
      type: "object",
      properties: {
        pokemon_name: {
          type: "string",
          description: "The name or ID of the Pokémon to look up"
        }
      },
      required: ["pokemon_name"]
    }
  },
  {
    name: "analyze_pokemon_team",
    description: "Analyze a team of Pokémon for type coverage, weaknesses, and strategic recommendations",
    input_schema: {
      type: "object",
      properties: {
        pokemon_names: {
          type: "array",
          items: { type: "string" },
          description: "Array of Pokémon names to analyze as a team"
        }
      },
      required: ["pokemon_names"]
    }
  }
]

export async function executeTool(toolName: string, input: any): Promise<ToolResult> {
  switch (toolName) {
    case "get_pokemon_info":
      return await getPokemonInfo(input.pokemon_name)
    case "analyze_pokemon_team":
      return await analyzePokemonTeam(input.pokemon_names)
    default:
      return {
        content: `Unknown tool: ${toolName}`,
        is_error: true
      }
  }
}

async function getPokemonInfo(pokemonName: string): Promise<ToolResult> {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`)
    
    if (!response.ok) {
      return {
        content: `Pokémon "${pokemonName}" not found. Please check the spelling and try again.`,
        is_error: true
      }
    }

    const pokemon = await response.json()
    
    const speciesResponse = await fetch(pokemon.species.url)
    const species = await speciesResponse.json()
    
    const flavorText = species.flavor_text_entries
      .find((entry: any) => entry.language.name === 'en')?.flavor_text
      .replace(/\f/g, ' ') || 'No description available.'

    const info = {
      name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
      id: pokemon.id,
      height: pokemon.height / 10,
      weight: pokemon.weight / 10,
      types: pokemon.types.map((type: any) => type.type.name),
      abilities: pokemon.abilities.map((ability: any) => ability.ability.name),
      stats: pokemon.stats.reduce((acc: any, stat: any) => {
        acc[stat.stat.name] = stat.base_stat
        return acc
      }, {}),
      description: flavorText
    }

    const totalStats = Object.values(info.stats).reduce((a: any, b: any) => a + b, 0)

    return {
      content: `**${info.name}** (#${info.id})

**Description:** ${info.description}

**Physical Attributes:**
- Height: ${info.height}m
- Weight: ${info.weight}kg

**Types:** ${info.types.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}

**Abilities:** ${info.abilities.map((a: string) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}

**Base Stats:**
- HP: ${info.stats.hp}
- Attack: ${info.stats.attack}
- Defense: ${info.stats.defense}
- Special Attack: ${info.stats['special-attack']}
- Special Defense: ${info.stats['special-defense']}
- Speed: ${info.stats.speed}
- **Total:** ${totalStats}`
    }
  } catch (error) {
    return {
      content: `Error fetching information for "${pokemonName}": ${error}`,
      is_error: true
    }
  }
}

async function analyzePokemonTeam(pokemonNames: string[]): Promise<ToolResult> {
  try {
    if (pokemonNames.length === 0) {
      return {
        content: "Please provide at least one Pokémon name to analyze.",
        is_error: true
      }
    }

    if (pokemonNames.length > 6) {
      return {
        content: "A Pokémon team can have at most 6 members. Please provide 6 or fewer Pokémon.",
        is_error: true
      }
    }

    const teamData = []
    
    for (const name of pokemonNames) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`)
        if (response.ok) {
          const pokemon = await response.json()
          teamData.push({
            name: pokemon.name,
            types: pokemon.types.map((type: any) => type.type.name),
            stats: pokemon.stats.reduce((acc: any, stat: any) => {
              acc[stat.stat.name] = stat.base_stat
              return acc
            }, {})
          })
        }
      } catch (error) {
        console.error(`Error fetching ${name}:`, error)
      }
    }

    if (teamData.length === 0) {
      return {
        content: "Could not find any of the specified Pokémon. Please check the names and try again.",
        is_error: true
      }
    }

    const typeChart: Record<string, { weak: string[], strong: string[] }> = {
      normal: { weak: ['fighting'], strong: [] },
      fire: { weak: ['water', 'ground', 'rock'], strong: ['grass', 'ice', 'bug', 'steel'] },
      water: { weak: ['electric', 'grass'], strong: ['fire', 'ground', 'rock'] },
      electric: { weak: ['ground'], strong: ['water', 'flying'] },
      grass: { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], strong: ['water', 'ground', 'rock'] },
      ice: { weak: ['fire', 'fighting', 'rock', 'steel'], strong: ['grass', 'ground', 'flying', 'dragon'] },
      fighting: { weak: ['flying', 'psychic', 'fairy'], strong: ['normal', 'ice', 'rock', 'dark', 'steel'] },
      poison: { weak: ['ground', 'psychic'], strong: ['grass', 'fairy'] },
      ground: { weak: ['water', 'grass', 'ice'], strong: ['fire', 'electric', 'poison', 'rock', 'steel'] },
      flying: { weak: ['electric', 'ice', 'rock'], strong: ['grass', 'fighting', 'bug'] },
      psychic: { weak: ['bug', 'ghost', 'dark'], strong: ['fighting', 'poison'] },
      bug: { weak: ['fire', 'flying', 'rock'], strong: ['grass', 'psychic', 'dark'] },
      rock: { weak: ['water', 'grass', 'fighting', 'ground', 'steel'], strong: ['fire', 'ice', 'flying', 'bug'] },
      ghost: { weak: ['ghost', 'dark'], strong: ['psychic', 'ghost'] },
      dragon: { weak: ['ice', 'dragon', 'fairy'], strong: ['dragon'] },
      dark: { weak: ['fighting', 'bug', 'fairy'], strong: ['psychic', 'ghost'] },
      steel: { weak: ['fire', 'fighting', 'ground'], strong: ['ice', 'rock', 'fairy'] },
      fairy: { weak: ['poison', 'steel'], strong: ['fighting', 'dragon', 'dark'] }
    }

    const allTypes = teamData.flatMap(pokemon => pokemon.types)
    const typeCount = allTypes.reduce((acc: any, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const weaknesses: Record<string, number> = {}
    teamData.forEach(pokemon => {
      pokemon.types.forEach((type: string) => {
        const typeWeaknesses = typeChart[type]?.weak || []
        typeWeaknesses.forEach(weakness => {
          weaknesses[weakness] = (weaknesses[weakness] || 0) + 1
        })
      })
    })

    const avgStats = teamData.reduce((acc: any, pokemon) => {
      Object.keys(pokemon.stats).forEach(stat => {
        acc[stat] = (acc[stat] || 0) + pokemon.stats[stat]
      })
      return acc
    }, {})

    Object.keys(avgStats).forEach(stat => {
      avgStats[stat] = Math.round(avgStats[stat] / teamData.length)
    })

    const analysis = `**Team Analysis for ${teamData.length} Pokémon:**

**Team Members:** ${teamData.map(p => p.name.charAt(0).toUpperCase() + p.name.slice(1)).join(', ')}

**Type Distribution:**
${Object.entries(typeCount).map(([type, count]) => `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`).join('\n')}

**Common Weaknesses:**
${Object.entries(weaknesses)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .slice(0, 5)
  .map(([type, count]) => `- ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count} team members vulnerable`)
  .join('\n')}

**Average Team Stats:**
- HP: ${avgStats.hp}
- Attack: ${avgStats.attack}
- Defense: ${avgStats.defense}
- Special Attack: ${avgStats['special-attack']}
- Special Defense: ${avgStats['special-defense']}
- Speed: ${avgStats.speed}

**Recommendations:**
${weaknesses.water && weaknesses.water >= 3 ? '- Consider adding a Water-resistant Pokémon (Grass, Water, or Dragon type)\n' : ''}${weaknesses.fire && weaknesses.fire >= 3 ? '- Consider adding a Fire-resistant Pokémon (Fire, Water, Rock, or Dragon type)\n' : ''}${avgStats.speed < 70 ? '- Your team is relatively slow - consider adding a fast Pokémon for speed control\n' : ''}${avgStats.defense < 70 ? '- Your team has low physical defense - consider adding a defensive wall\n' : ''}${Object.keys(typeCount).length < 4 ? '- Consider diversifying your team types for better coverage\n' : ''}This analysis provides a strategic overview of your team's strengths and potential areas for improvement!`

    return { content: analysis }
  } catch (error) {
    return {
      content: `Error analyzing team: ${error}`,
      is_error: true
    }
  }
}