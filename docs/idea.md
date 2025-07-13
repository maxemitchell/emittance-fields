# Emittance Fields

In it's simplest form, this can be thought of as an r/place implementation. We have a "field" of variable size, and users can place "emitters" at points within that field. These emitters can be thought of as unmoving pixels with only `{x,y,color}` as state. 

In it's fully realized form, the field is more like a flow field simulation, with the emitters emitting particles with `{x,y,x_velocity,y_velocity,color,lifespan,count,modulation}` as state. We could even have different types of emitters, though I'm not sure what those could be. We could also allow parametric equations for each of the variables, but this adds a lot of complexity very quickly and I'd like to stay focused on the Authorization.

## Data Models

### Fields
- id
- width
- height
- background_color
- owner_id
- is_public
- created_at
- updated_at

### Emitters
- id
- field_id
- visual_state (jsonb)
- created_at
- updated_at

### FieldCollaborators
- id
- field_id
- user_id
- role
- created_at
- updated_at

### Users
- id
- username
