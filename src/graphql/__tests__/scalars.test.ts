import { describe, expect, it } from 'vitest';
import { GraphQLError, GraphQLObjectType, GraphQLSchema, graphql, Kind } from 'graphql';
import { CalendarDateScalar } from '../scalars';

const expectBadUserInput = (action: () => unknown) => {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(GraphQLError);
    expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT');
    return;
  }
  throw new Error('Expected the value to be rejected');
};

describe('CalendarDateScalar output', () => {
  it('sends a stored date as YYYY-MM-DD, never as a millisecond string', async () => {
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          expiryDate: {
            type: CalendarDateScalar,
            resolve: () => new Date('2026-11-08T00:00:00.000Z'),
          },
        },
      }),
    });

    const result = await graphql({ schema, source: '{ expiryDate }' });

    expect(result.errors).toBeUndefined();
    expect(result.data?.expiryDate).toBe('2026-11-08');
  });

  it('passes through a date the AI already shaped as YYYY-MM-DD', () => {
    expect(CalendarDateScalar.serialize('2026-11-08')).toBe('2026-11-08');
  });

  it.each(['next Wednesday', '1794096000000', 1794096000000])('refuses to send %j', (value) => {
    expect(() => CalendarDateScalar.serialize(value)).toThrow();
  });
});

describe('CalendarDateScalar input', () => {
  it('turns a variable into the Date that Prisma stores', () => {
    expect(CalendarDateScalar.parseValue('2026-11-08')).toEqual(
      new Date('2026-11-08T00:00:00.000Z'),
    );
  });

  it('turns an inline value into the Date that Prisma stores', () => {
    expect(CalendarDateScalar.parseLiteral({ kind: Kind.STRING, value: '2026-11-08' })).toEqual(
      new Date('2026-11-08T00:00:00.000Z'),
    );
  });

  it.each(['', 'next Wednesday', '2026-02-30', '1794096000000', 1794096000000])(
    'rejects the variable %j as bad user input',
    (value) => {
      expectBadUserInput(() => CalendarDateScalar.parseValue(value));
    },
  );

  it('rejects an inline value that is not a string', () => {
    expectBadUserInput(() =>
      CalendarDateScalar.parseLiteral({ kind: Kind.INT, value: '1794096000000' }),
    );
  });
});
