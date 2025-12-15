import { NextRequest } from 'next/server';
import { getDocument } from '@/lib/db/documents';

// Server-Sent Events endpoint for real-time progress updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  // Create readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const sendEvent = (data: any) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (err) {
            isClosed = true;
          }
        }
      };

      const sendError = (error: string) => {
        sendEvent({ error });
        isClosed = true;
        controller.close();
      };

      try {
        // Poll Google Sheets every 5 seconds (reduced to avoid rate limits)
        const pollInterval = setInterval(async () => {
          if (isClosed) {
            clearInterval(pollInterval);
            return;
          }

          try {
            const document = await getDocument(documentId);

            if (!document) {
              clearInterval(pollInterval);
              sendError('Document not found');
              return;
            }

            // Send current status
            sendEvent({
              status: document.status,
              progress: document.progress_percentage,
              currentStep: document.current_step,
              errorMessage: document.error_message,
            });

            // Close connection if processing is complete or failed
            if (document.status === 'complete' || document.status === 'error') {
              clearInterval(pollInterval);
              isClosed = true;
              controller.close();
            }
          } catch (error) {
            console.error('[SSE] Error fetching document:', error);
            clearInterval(pollInterval);
            if (!isClosed) {
              sendError('Error fetching document status');
            }
          }
        }, 5000); // Poll every 5 seconds to avoid rate limits

        // Initial fetch
        const document = await getDocument(documentId);
        if (document) {
          sendEvent({
            status: document.status,
            progress: document.progress_percentage,
            currentStep: document.current_step,
            errorMessage: document.error_message,
          });
        }

        // Cleanup on connection close
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          controller.close();
        });
      } catch (error) {
        console.error('[SSE] Error:', error);
        sendError('Internal server error');
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
