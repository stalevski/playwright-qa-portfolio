import type { Response } from 'express';

export const respondNotFound = (response: Response, message: string): void => {
  response.status(404).json({ message });
};
