# Native iOS / Apple Watch Roadmap

## Decision

IronLog will not try to fake Apple Watch or Apple Health integration inside the PWA.

A web app/PWA cannot directly read HealthKit workout history, Apple Watch calories, heart-rate samples, or completed Apple Fitness workouts. Any UI that implies automatic Apple Watch matching in the current PWA is misleading and should stay out of the production experience.

## Current PWA focus

Until a native iOS shell is realistic, IronLog should prioritize features that work reliably on the web:

- Fast workout logging
- Program/routine building
- Supersets
- Machine setup
- Exercise history
- PR detection
- Progress analytics
- Cardio exercise types and manual cardio logging
- Account/sync polish
- PWA update reliability
- UI polish and accessibility

## Future native iOS goal

When there is budget/time for native work, the preferred direction is a Capacitor or native iOS wrapper that keeps the existing web app logic while adding HealthKit permissions.

Target HealthKit reads:

- Workouts
- Active energy burned
- Total energy burned
- Heart rate samples
- Average and max heart rate
- Distance
- Workout start/end times

Target pairing logic:

1. IronLog workout has start/end timestamps.
2. Native iOS queries HealthKit workouts overlapping that window.
3. Best match is suggested automatically.
4. Multiple Watch workouts can be merged if Apple Watch was stopped/restarted.
5. User can manually override the match.

## Future watchOS goal

Long term, a watchOS companion could start and track the workout directly from IronLog, removing the need to match separate Apple Fitness workouts.

Potential watchOS features:

- Live exercise display
- Set completion
- Rest timer
- Haptics
- Heart rate
- Active calories
- Workout session control
- Sync back to iPhone/Supabase

## Rule going forward

Do not add Apple Watch UI to the PWA that claims or implies automatic HealthKit access. Keep Apple Watch integration documented as a future native feature until the app has native HealthKit capability.
