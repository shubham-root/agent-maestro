This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Important Notes for /roo/task API Integration

### Task Completion Timing

When calling the `/roo/task` API and processing the Server-Sent Events (SSE) stream, be aware that **message events may still be emitted after the `task_completed` event**. To handle this corner case properly:

- Add a brief delay (a few seconds) after receiving `task_completed` before finalizing the task state
- Continue processing any incoming message events during this delay period
- Only reset the UI state (enable input, focus textarea) after the delay completes

This ensures all streaming message content is properly received and displayed before allowing new user input.

```javascript
// Example implementation
if (currentEvent === "task_completed") {
  showStatusMessage("Response completed! Finalizing...");
  // Wait a few seconds before finishing task to allow any remaining message events
  setTimeout(() => {
    setIsWaitingForResponse(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    showStatusMessage("Task completed!");
  }, 3000); // Adjust delay as needed based on your use case
}
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
