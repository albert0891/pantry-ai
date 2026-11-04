import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import { calendarDateToUtc, isCalendarDate, utcToCalendarDate } from '../lib/dates/calendarDate';

// ---------------------------------------------------------------------------
// Educational Note: Custom Scalars
//
// A scalar is a single value at the end of a GraphQL field, like String or Int.
// Declaring a date as String made graphql-js turn Prisma's Date into a millisecond
// string ("1794096000000"), and every client had to guess how to read it. A custom
// scalar is the one place that decides how a value crosses the API boundary:
// serialize runs on the way out; parseValue and parseLiteral run on the way in.
// ---------------------------------------------------------------------------

const invalidDateError = () =>
  new GraphQLError('Please enter a valid date.', { extensions: { code: 'BAD_USER_INPUT' } });

export const CalendarDateScalar = new GraphQLScalarType<Date, string>({
  name: 'CalendarDate',
  description: 'A day on the calendar as YYYY-MM-DD, with no time and no time zone.',

  serialize(value) {
    if (value instanceof Date) return utcToCalendarDate(value);
    // AI-parsed items hold a date that normalizeParsedItem already validated.
    if (isCalendarDate(value)) return value;
    throw new GraphQLError('CalendarDate cannot represent this value.');
  },

  // A value sent through a query variable, which is how the frontend sends dates.
  parseValue(value) {
    if (!isCalendarDate(value)) throw invalidDateError();
    return calendarDateToUtc(value);
  },

  // A value written directly inside the query text.
  parseLiteral(node) {
    if (node.kind !== Kind.STRING || !isCalendarDate(node.value)) throw invalidDateError();
    return calendarDateToUtc(node.value);
  },
});
