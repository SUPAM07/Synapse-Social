import { BaseEvent } from '@uevent/kafka';

export interface UserRegisteredDomainEvent extends BaseEvent {
  userId: string;
  login: string;
  email: string;
  fullName: string;
}

export const createUserRegisteredEvent = (
  userId: string,
  login: string,
  email: string,
  fullName: string,
): UserRegisteredDomainEvent => ({
  messageId: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  version: 1,
  userId,
  login,
  email,
  fullName,
});
