# Assets Directory

## Guus Avatar Setup

To use the Guus photo as avatar:

1. **Save the photo** as `guus-avatar.jpg` in this directory
2. **Recommended specs:**
   - Square aspect ratio (1:1)
   - Minimum 200x200px
   - Maximum 500x500px for performance
   - Format: .jpg, .jpeg, .png, or .webp
   - Professional headshot style

3. **Run build** to copy to dist:
   ```bash
   npm run build
   ```

4. **Deploy** to make it live:
   ```bash
   npx netlify deploy --prod --dir=dist --functions=netlify/functions
   ```

## Current Configuration

The widget is configured to use:
- **Primary**: `https://chatguuspt.netlify.app/assets/guus-avatar.jpg`
- **Fallback**: 🤖 (robot emoji)

If the photo fails to load, it will automatically fall back to the emoji.

## Testing

You can test different avatar configurations by passing options to the widget:

```javascript
ChatGuus.init({
  avatar: 'https://example.com/custom-avatar.jpg',
  avatarFallback: '👨‍💼',
  // ... other options
});
```
