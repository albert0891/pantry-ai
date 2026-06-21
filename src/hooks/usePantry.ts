"use client";

import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';

export const GET_PANTRY_ITEMS = gql`
  query GetMyPantry {
    myPantryItems {
      id
      name
      quantity
      category
      boardState
      expiryDate
    }
    myRecipes {
      id
      title
      ingredients
      instructions
      createdAt
    }
  }
`;

export const UPDATE_ITEM_STATE = gql`
  mutation UpdateItemState($id: ID!, $newState: BoardState!) {
    updateItemState(id: $id, newState: $newState) {
      id
      boardState
    }
  }
`;

export const ADD_ITEM = gql`
  mutation AddPantryItem($name: String!, $quantity: Int!, $category: Category, $expiryDate: String) {
    addPantryItem(name: $name, quantity: $quantity, category: $category, expiryDate: $expiryDate) {
      id
      name
      quantity
      category
      boardState
      expiryDate
    }
  }
`;

export const EDIT_ITEM = gql`
  mutation EditPantryItem($id: ID!, $name: String!, $quantity: Int!, $category: Category!, $expiryDate: String) {
    editPantryItem(id: $id, name: $name, quantity: $quantity, category: $category, expiryDate: $expiryDate) {
      id
      name
      quantity
      category
      expiryDate
    }
  }
`;

export const MOVE_ITEM = gql`
  mutation MoveItem($id: ID!, $amount: Int!, $targetState: BoardState!) {
    moveItem(id: $id, amount: $amount, targetState: $targetState) {
      id
      quantity
      boardState
    }
  }
`;

export const DELETE_ITEM = gql`
  mutation DeleteItem($id: ID!) {
    deletePantryItem(id: $id)
  }
`;

export const GENERATE_RECIPE = gql`
  mutation GenerateRecipe($mustUseItemIds: [String!]!) {
    generateRecipe(mustUseItemIds: $mustUseItemIds) {
      title
      ingredients
      instructions
    }
  }
`;

export const SAVE_RECIPE = gql`
  mutation SaveRecipe($title: String!, $ingredients: [String!]!, $instructions: [String!]!) {
    saveRecipe(title: $title, ingredients: $ingredients, instructions: $instructions) {
      id
    }
  }
`;

export function usePantry() {
  const { data, loading, error } = useQuery<any>(GET_PANTRY_ITEMS);
  const [updateItemState] = useMutation(UPDATE_ITEM_STATE);
  const [addItem] = useMutation(ADD_ITEM, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });
  const [editItem] = useMutation(EDIT_ITEM, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });
  const [moveItem] = useMutation(MOVE_ITEM, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });
  const [deleteItem] = useMutation(DELETE_ITEM, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });
  const [generateRecipe] = useMutation(GENERATE_RECIPE);
  const [saveRecipe] = useMutation(SAVE_RECIPE, { refetchQueries: [{ query: GET_PANTRY_ITEMS }] });

  return {
    items: data?.myPantryItems || [],
    myRecipes: data?.myRecipes || [],
    loading,
    error,
    updateItemState,
    addItem,
    editItem,
    moveItem,
    deleteItem,
    generateRecipe,
    saveRecipe
  };
}
