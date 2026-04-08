export class ClientError extends Error {
  constructor(public message: string, public status: number = 500) {
    super(message);
    this.name = 'ClientError';
  }
}

export class NotFoundError extends ClientError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ClientError {
  constructor() {
    super('Unauthorized', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ClientError {
  constructor() {
    super('Forbidden', 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends ClientError {
  constructor(message: string) {
    super(message, 422);
    this.name = 'ValidationError';
  }
}
