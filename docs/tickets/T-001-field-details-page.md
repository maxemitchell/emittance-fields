# Ticket T-001: Field Details Page

### Title

Implement Field Details Page with Canvas Visualization

### Priority

- [x] High

### Type

- [x] Feature

### Status

- [x] Ready

### Authorization Focus

Displays fields based on user permissions - owners see edit controls, collaborators see based on role, public fields visible to all users.

### Description

Create a dedicated page for viewing individual fields that shows:

- Field metadata (name, description, dimensions, background color)
- Canvas visualization of the field with current emitters
- Basic field information and owner details
- Navigation between field list and field details

### Implementation Details

- Create `/fields/[id]` route with server-side field loading
- Build canvas component to render field dimensions and background
- Display emitters as colored pixels on the canvas
- Show field metadata in sidebar or header
- Handle field not found and permission denied cases
- Add navigation back to fields list

### Acceptance Criteria

- [ ] Field details page accessible at `/fields/[field_id]`
- [ ] Canvas renders field dimensions and background color accurately
- [ ] Existing emitters display as colored pixels at correct coordinates
- [ ] Field metadata displays (name, description, owner, creation date)
- [ ] Navigation link back to fields list
- [ ] Proper error handling for invalid field IDs
- [ ] Authorization respected (only accessible to users with permission)

### Testing Requirements

- [ ] E2E tests for field details page navigation
- [ ] Canvas rendering tests for different field sizes
- [ ] Permission tests (owner/collaborator/public access)
- [ ] Error state tests (404, unauthorized)

### Dependencies

None

### Estimated Effort

- [x] M (1 day)

### Notes

This establishes the foundation for field visualization before adding emitter placement functionality.
