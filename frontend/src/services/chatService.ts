import api from "@/lib/api";

export interface ChatResponse {
  success: boolean;
  reply: string;
  is_fallback?: boolean;
}

export async function askChatbot(message: string): Promise<ChatResponse> {
  try {
    const { data } = await api.post<ChatResponse>("/chat", { message });
    return data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data as ChatResponse;
    }
    return {
      success: false,
      is_fallback: true,
      reply: "Sorry, I couldn't connect to the server right now."
    };
  }
}
