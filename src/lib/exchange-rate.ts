export async function fetchLatestUsdBrlRate(): Promise<number> {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`AwesomeAPI returned status ${response.status}`);
    }

    const data = await response.json();
    const rate = parseFloat(data.USDBRL.bid);
    
    if (isNaN(rate)) {
      throw new Error('Failed to parse exchange rate as number');
    }

    return rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return 5.65; // Fallback rate as per requirements
  }
}
