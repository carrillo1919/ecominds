import { generateToken, resetTokenExpiry } from '../utils/tokens.js';
import HttpError from '../utils/httpError.js';

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export default HttpError;
