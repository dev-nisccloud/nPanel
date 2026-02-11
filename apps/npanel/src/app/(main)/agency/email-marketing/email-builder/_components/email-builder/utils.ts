import { renderToStaticMarkup as baseRenderToStaticMarkup } from 'react-dom/server';
import { Reader } from '@usewaypoint/email-builder';
import React from 'react';

export function renderToHtml(document: any) {
    return (
        '<!DOCTYPE html>' +
        baseRenderToStaticMarkup(
            React.createElement('html', null,
                React.createElement('body', null,
                    React.createElement(Reader, { document, rootBlockId: 'root' })
                )
            )
        )
    );
}
