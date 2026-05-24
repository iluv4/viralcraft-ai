export function handleGeminiError(error: any): never {
  console.error("Gemini API Error:", error);
  
  const errorString = JSON.stringify(error);
  
  if (errorString.includes("RESOURCE_EXHAUSTED") || errorString.includes("spending cap")) {
    throw new Error("AI 사용 한도가 초과되었습니다. AI Studio(https://ai.studio/spend)에서 한도 설정을 확인하시거나, 잠시 후 다시 시도해주세요.");
  }
  
  if (errorString.includes("QUOTA_EXCEEDED")) {
    throw new Error("요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
  }

  if (errorString.includes("API_KEY_INVALID")) {
    throw new Error("API 키가 올바르지 않습니다. 설정을 확인해주세요.");
  }

  // Fallback to original error or a generic one
  throw new Error(error.message || "AI 서비스 연동 중 오류가 발생했습니다.");
}
