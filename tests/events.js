Events.insert({
  userId: 'IEN',
  start: DateTime.local().plus({ days: 1 }).toMillis(),
  end: DateTime.local().plus({ days: 1 }).plus({ hours: 2 }).toMillis(),
  tag: 'sol',
  summary: 'Activité test',
  slug: `IEN-${DateTime.local().plus({ days: 1 }).toISO()}-test`
})
