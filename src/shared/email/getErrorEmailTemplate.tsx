import React from 'react';

export function getErrorEmailTemplate(message: string) {
  return <html>
    <p>There was an error processing a request.</p>
    <p>{message}</p>
  </html>;
}
