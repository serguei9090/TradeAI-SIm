
export const getTradingSuggestions = async (marketData: any, retries = 3): Promise<string[]> => {
  const prompt = `Based on the following market data, suggest 3 stocks that are promising for automated trading.
  Market Data: ${JSON.stringify(marketData)}
  Return ONLY a JSON array of strings (ticker symbols only), e.g., ["AAPL", "MSFT", "GOOG"]. Do not include any other text.`;
  
  // Get settings from localStorage
  const provider = localStorage.getItem('modelProvider') || 'gemini';
  const apiUrl = localStorage.getItem('customApiUrl') || '';
  const model = localStorage.getItem('customApiModel') || '';

  try {
    const response = await fetch("/api/ai-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt,
        provider,
        apiUrl,
        model
      }),
    });

    if (!response.ok) throw new Error("Failed to fetch from proxy");
    
    const data = await response.json();
    
    // Extract content based on OpenAI-compatible response structure
    const text = data.choices ? data.choices[0].message.content : (data.text || '');
    const jsonMatch = text.match(/\[.*\]/s);
    
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying AI suggestion... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getTradingSuggestions(marketData, retries - 1);
    }
    console.error("AI suggestion failed after retries:", error);
    throw error;
  }
};
