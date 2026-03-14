import axios from "axios";

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export const withTryCatch = async <T>(
  callback: () => Promise<T>,
  fallbackMessage = "Something went wrong"
) => {
  try {
    return await callback();
  } catch (error) {
    throw new Error(getErrorMessage(error, fallbackMessage));
  }
};
