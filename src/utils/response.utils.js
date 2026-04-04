export function successResponse(data) {
  return { success: true, data };
}

export function errorResponse(message, errors = []) {
  return { success: false, message, errors };
}
