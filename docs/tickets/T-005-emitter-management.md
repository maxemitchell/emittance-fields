# Ticket T-005: Emitter Management System

### Title

Implement Emitter Editing and Deletion

### Priority

- [x] Medium

### Type

- [x] Feature

### Status

- [x] Ready

### Authorization Focus

Only users with editor permissions can modify/delete emitters. System must track emitter ownership and enforce permissions consistently.

### Description

Allow authorized users to edit and delete existing emitters:

- Click on emitter to select and edit
- Change emitter color
- Move emitter to new coordinates
- Delete emitters
- Bulk operations for emitter management

### Implementation Details

- Add emitter selection on canvas click
- Create emitter edit modal/panel
- Implement emitter drag-and-drop for repositioning
- Build emitter deletion with confirmation
- Add emitter context menu or toolbar
- Batch operations for multiple emitters

### Acceptance Criteria

- [ ] Click on emitter selects it with visual feedback
- [ ] Selected emitter can be edited (color change)
- [ ] Emitters can be moved via drag-and-drop or coordinate input
- [ ] Delete emitter with confirmation
- [ ] Only users with editor permissions can modify emitters
- [ ] Cannot move emitter to occupied coordinates
- [ ] Emitter operations update in real-time
- [ ] Undo/redo functionality for emitter operations

### Testing Requirements

- [ ] Unit tests for emitter selection and validation
- [ ] Integration tests for emitter CRUD operations
- [ ] E2E tests for emitter management workflows
- [ ] Authorization tests for edit permissions

### Dependencies

- T-002 (Emitter Placement System)

### Estimated Effort

- [x] M (1 day)

### Notes

Completes the emitter system with full CRUD operations while maintaining authorization integrity.
