declare namespace Express {
  interface Request {
    requestId: string;
  }
  interface Response {
    fail: (error: Error) => void;
    success: ({ data: object, ...info }) => void;
  }
}