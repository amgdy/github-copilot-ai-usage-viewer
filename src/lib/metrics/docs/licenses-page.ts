import type { MetricDoc } from '../types';

/** Numbers that only the Licenses page shows. The license report itself is explained in ./licenses.ts. */
export const LICENSES_PAGE_DOCS: MetricDoc[] = [
  {
    id: 'license-status-breakdown',
    title: 'Seats by activity',
    area: 'Seats and licenses',
    basis: 'calculated',
    meaning: 'Every seat in the license list, grouped by what the list says about its last activity. The groups add up to all seats.',
    formula: 'Days since activity = as-of date − date of the last activity of the seat',
    steps: [
      'Active in the last 30 days: fewer than 30 days since the last activity.',
      'Last active 30 to 89 days ago: 30 to 89 days since the last activity.',
      'No activity for 90 days or more: 90 days or more since the last activity.',
      'No recent activity date: the list has activity data, but this seat has no last activity date.',
      'No activity data: the list has no activity data at all, for example a plain list of usernames, or it has no date to count from.',
    ],
    settings: ['roster', 'rosterAsOf'],
    notes: [
      'Only the license list is used here. The usage report, the date range and the filters do not change these groups.',
      'A blank activity date can mean a new seat or activity older than 90 days. It does not prove that the seat was never used. These seats are shown for review and are not counted as seats to free.',
      'Seats with a cancellation pending, new seats and seats with recent usage in the report are also left out of the list of seats to free.',
      'Code completions count as activity in the license list, but they are not in the usage report. So a seat can be active here and have no usage in the report.',
    ],
    example: 'The list is dated June 30 and has 250 seats. 180 were active after June 1, 30 were last active in April or May, 25 were last active before April 1, and 15 have no activity date. That is 180 + 30 + 25 + 15 = 250 seats.',
    related: ['license-as-of', 'license-active-recently', 'license-fading', 'license-reclaim', 'license-no-activity-date', 'license-seats'],
    links: ['remindInactive'],
  },
  {
    id: 'license-no-activity-date',
    title: 'Seats with no recent activity date',
    area: 'Seats and licenses',
    basis: 'calculated',
    meaning: "Seats whose license data has no last activity date. The date alone cannot tell whether the seat is new or its activity is older than GitHub's 90-day history.",
    formula: 'No recent activity date = seat in an activity-aware license list with no last activity date',
    steps: [
      'Read the last activity date for each seat in the license list.',
      'List seats for which the date is blank, separately from seats with no activity data at all.',
      'Do not count a blank date as proof that the user never used GitHub Copilot. Review the seat before changing access.',
    ],
    columns: ['username'],
    settings: ['roster', 'rosterAsOf'],
    notes: [
      'GitHub keeps only 90 days of activity history. A blank date can mean the seat is new or its activity is older than that history.',
      'These seats are not counted as seats to free or unused seats. The activity report also has no seat creation date.',
      'A plain list of usernames has no activity fields. Those seats are shown as having no activity data, not in this list.',
    ],
    example: 'An activity report lists 100 seats. It has dates for 82 seats and blank dates for 18. The 18 are shown for review and none is counted as a seat to free based on the blank date.',
    related: ['license-status-breakdown', 'license-reclaim', 'license-new-seats', 'license-import'],
    links: ['activityReport', 'seatAssignment'],
  },
  {
    id: 'license-never-seen',
    title: 'Seats never in the report',
    area: 'Seats and licenses',
    basis: 'calculated',
    meaning: 'Seats in the license list whose user has no row in any loaded file. The seat is paid for, but the report shows no usage by this user at all.',
    formula: 'Seats never in the report = seats whose username is in no row of the loaded files',
    steps: [
      'Compare each username in the license list with the usernames in every loaded file. Capital letters and spaces around the name do not matter.',
      'Count the usernames that are in no row.',
    ],
    columns: ['username'],
    settings: ['roster'],
    notes: [
      'The date range and the filters do not change this number, because it looks at every loaded file.',
      'Together with the seats with usage in this view and the seats with usage outside this view, it adds up to all seats.',
      'A seat that is never in the report can still be in use, for example for code completions, which are not in the report. The activity data in the license list tells you more.',
    ],
    example: '250 seats, of which 200 have usage in this view and 30 have usage only outside it: 250 − 200 − 30 = 20 seats never in the report.',
    related: ['license-matched', 'license-outside-scope', 'seat-unused', 'license-status-breakdown', 'license-seats'],
  },
];
