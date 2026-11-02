'use client';

import { gql } from '@apollo/client/core';
import { useMutation } from '@apollo/client/react';

export const CATEGORIZE_ITEM = gql`
  mutation CategorizeItem($name: String!) {
    categorizeItem(name: $name)
  }
`;

export const PARSE_VOICE_INPUT = gql`
  mutation ParseVoiceInput($transcript: String!) {
    parseVoiceInput(transcript: $transcript) {
      name
      quantity
      category
      expiryDate
    }
  }
`;

export interface ParsedPantryItem {
  name: string;
  quantity: number | null;
  category: string | null;
  expiryDate: string | null;
}

/**
 * AI helpers for the item form. Both go through GraphQL, so they carry the
 * user's auth token and count against the server-side rate limits.
 * Each function resolves with the AI result, or throws an Error whose message
 * is safe to show to the user (e.g. a rate-limit notice).
 */
export function useItemAssistant() {
  // 'no-cache': results are one-off suggestions, and transcripts should not linger in the cache.
  const [categorize] = useMutation<{ categorizeItem: string }, { name: string }>(CATEGORIZE_ITEM, {
    fetchPolicy: 'no-cache',
  });
  const [parseVoice] = useMutation<{ parseVoiceInput: ParsedPantryItem }, { transcript: string }>(
    PARSE_VOICE_INPUT,
    { fetchPolicy: 'no-cache' },
  );

  const categorizeItem = async (name: string): Promise<string> => {
    const { data } = await categorize({ variables: { name } });
    if (!data) throw new Error('Auto-categorize failed. Please pick a category.');
    return data.categorizeItem;
  };

  const parseVoiceInput = async (transcript: string): Promise<ParsedPantryItem> => {
    const { data } = await parseVoice({ variables: { transcript } });
    if (!data) throw new Error("Couldn't understand that. Please try again.");
    return data.parseVoiceInput;
  };

  return { categorizeItem, parseVoiceInput };
}
