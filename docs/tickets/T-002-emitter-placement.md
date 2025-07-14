# Ticket T-002: Emitter Placement System

### Title

Implement Click-to-Place Emitter System

### Priority

- [x] High

### Type

- [x] Feature

### Status

- [x] Ready

### Authorization Focus

Core authorization feature - only users with editor permissions (owner or editor collaborators) can place emitters. Must validate placement permissions server-side.

### Description

Enable users to place emitters by clicking on the field canvas:

- Click on canvas to place emitter at mouse coordinates
- Color picker for emitter selection
- Real-time visual feedback during placement
- Server-side validation of placement permissions
- Optimistic UI updates with rollback on error

### Implementation Details

- Add click handler to canvas component
- Create color picker component/input
- Build emitter placement API endpoint (`POST /api/emitters`)
- Implement coordinate validation (within field bounds)
- Add real-time emitter insertion to canvas
- Handle placement errors gracefully

### Acceptance Criteria

- [ ] Click on canvas places emitter at exact mouse coordinates
- [ ] Color picker allows selection of emitter color
- [ ] Only authorized users can place emitters (owner + editor collaborators)
- [ ] Coordinates validated to be within field bounds
- [ ] Emitters appear immediately with optimistic updates
- [ ] Placement errors show user-friendly messages
- [ ] Cannot place emitters on occupied coordinates

### Testing Requirements

- [ ] Unit tests for coordinate calculation and validation
- [ ] Integration tests for emitter placement API
- [ ] E2E tests for click-to-place workflow
- [ ] Authorization tests (viewer/unauthorized users blocked)

### Dependencies

- T-001 (Field Details Page)

### Estimated Effort

- [x] L (2-3 days)

### Notes

This is the core interactive feature that demonstrates the authorization layer in action.
