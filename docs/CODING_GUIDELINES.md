# Coding Guidelines

## Date Handling Protocol

To ensure consistency and prevent timezone-related bugs, all date handling must follow this protocol.

### 1. Storage in Firestore

- **Rule:** Always store date and time values in Firestore using the native `Timestamp` object.
- **Implementation:** When saving data, convert JavaScript `Date` objects to Firestore Timestamps.

```typescript
// src/app/seasons/actions.ts
import { Timestamp } from 'firebase-admin/firestore';

const date = new Date('2025-09-05'); // The selected date
const seasonData = {
  startDate: Timestamp.fromDate(date),
  // ... other data
};
await db.collection('seasons').doc(id).set(seasonData);
```

### 2. Retrieval from Firestore (Server-Side)

- **Rule:** When fetching data from Firestore on the server, convert `Timestamp` objects into a serializable format before sending them to the client. The standard format is the ISO 8601 string.
- **Implementation:** Use the `.toDate().toISOString()` method on the retrieved Timestamp. Add checks to handle data that might already be a string to prevent runtime errors.

```typescript
// src/lib/data-service.ts
const toISOString = (dateValue: any): string => {
  if (!dateValue) return new Date().toISOString();
  if (typeof dateValue.toDate === 'function') { // It's a Firestore Timestamp
    return dateValue.toDate().toISOString();
  }
  if (typeof dateValue === 'string') { // It's already a string
    return new Date(dateValue).toISOString();
  }
  return new Date().toISOString(); // Fallback
};

const season = {
    startDate: toISOString(data.startDate),
    // ...
};
```

### 3. Logic and Display (Client-Side)

- **Rule:** For any logic (comparison, sorting) or display involving dates, components must be client components (`'use client'`). Date parsing and formatting must handle UTC correctly to avoid timezone conflicts.
- **Implementation:**
    - Use `parseISO` from `date-fns` to correctly interpret ISO strings from the server as UTC dates for any comparisons.
    - Use `useEffect` and `useState` to perform date formatting after the component has mounted on the client, preventing hydration errors.

```tsx
// src/app/dashboard/page.tsx
'use client';

import * as React from 'react';
import { format, parseISO } from 'date-fns';

// ... inside the component
const [displayDate, setDisplayDate] = React.useState('Loading...');

React.useEffect(() => {
    // Formatting is done on the client
    const formattedDate = format(parseISO(nextSeason.startDate), 'EEEE, MMMM d, yyyy');
    setDisplayDate(formattedDate);
}, [nextSeason.startDate]);

// ... in the JSX
<p>Starts on {displayDate}</p>
```