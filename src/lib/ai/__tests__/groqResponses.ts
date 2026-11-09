import type { Mock } from 'vitest';

// Fake Groq chat-completion responses, so the code under test runs its real
// fallback logic with only the network replaced. A Response body can be read
// once, so each call needs a fresh one: use mockImplementation for repeats.

export const answer = (content: string, finishReason = 'stop') =>
  new Response(
    JSON.stringify({ choices: [{ message: { content }, finish_reason: finishReason }] }),
    { status: 200 },
  );

export const httpError = (status: number) =>
  new Response(JSON.stringify({ error: { message: 'Service unavailable', code: status } }), {
    status,
  });

/** The JSON body of each request sent so far. */
export const requestBodies = (fetchMock: Mock) =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string));

export const modelsAsked = (fetchMock: Mock) => requestBodies(fetchMock).map((body) => body.model);
