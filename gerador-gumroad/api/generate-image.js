// Esta função será executada como uma Vercel Edge Function.
// O 'fetch' é globalmente disponível no ambiente Vercel Edge/Node.

export const config = {
  runtime: 'edge', // Define como uma Edge Function para desempenho
};

export default async function (request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Recebe todos os dados do formulário do frontend
  let requestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erro ao analisar o corpo da requisição JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const { description, style, colors, designType } = requestBody;

  // Busca a chave de API da variável de ambiente (SEGURA!)
  // É crucial configurar GOOGLE_API_KEY nas variáveis de ambiente da Vercel.
  const apiKey = process.env.GOOGLE_API_KEY; 

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Chave de API do Google não configurada no servidor (GOOGLE_API_KEY). Por favor, configure a Variável de Ambiente na Vercel.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Modelo e API do Google
  const model = 'imagen-4.0-generate-001';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

  // Montagem do prompt inteligente e criativo no backend
  let finalPrompt = `Crie um(a) ${designType} de alta qualidade, pronto(a) para venda no Gumroad. Tema principal: "${description}". Estilo: "${style}". Paleta de cores: "${colors}".`;

  // Adiciona melhorias de qualidade e formato específicas por tipo
  if (designType === 'planner') {
      finalPrompt += " Design de planner digital, formato A4, estilo limpo e profissional, layout vetorial, minimalista, alta resolução. Foco em diagramação e clareza.";
  } else if (designType === 'sticker-sheet') {
      finalPrompt += " Conjunto de stickers em uma folha, fofo, arte digital, estilo PNG com fundo transparente ou outline branco. Foco em alta resolução, cores vibrantes.";
  } else if (designType === 'gem') {
      finalPrompt += " Gema digital, cristal lapidado com muitas facetas, renderização 3D, macro shot, brilho intenso e refração de luz, cor translúcida. Fundo preto ou gradiente escuro.";
  } else if (designType === 'mockup') {
      finalPrompt += " Foto de mockup realista, design de produto digital aplicado em um item físico (ex: tablet ou caderno), foto de stock de alta qualidade, profundidade de campo, iluminação de estúdio.";
  }
  // Remove texto indesejado para um ativo digital limpo
  finalPrompt += " Sem texto, marcas d'água ou logotipos visíveis. Proporção 3:4.";

  const payload = { 
      instances: [{ prompt: finalPrompt }], 
      parameters: { "sampleCount": 1 } 
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorDetail = `Status: ${response.status}`;
      // Tenta extrair detalhes do erro da API
      try {
          const errorJson = await response.json();
          if (errorJson.error && errorJson.error.message) {
              errorDetail += `: ${errorJson.error.message}`;
          } else {
              errorDetail += `\nAPI Response: ${JSON.stringify(errorJson)}`;
          }
      } catch (e) {
          // Ignora se o corpo não for JSON
      }
      throw new Error(`Erro na API do Google! ${errorDetail}`);
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Erro na função serverless:", error);
    return new Response(JSON.stringify({ error: `Falha ao gerar imagem: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}