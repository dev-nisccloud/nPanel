import { renderToStaticMarkup as baseRenderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { StandardReader } from './core';
import { FONT_FAMILIES, GOOGLE_FONTS_URL } from './helpers/fontFamily';

export function renderToHtml(document: any) {
    return (
        '<!DOCTYPE html>' +
        baseRenderToStaticMarkup(
            React.createElement('html', null,
                React.createElement('head', null,
                    // React.createElement('link', { rel: 'stylesheet', href: GOOGLE_FONTS_URL })
                ),
                React.createElement('body', { style: { margin: 0, padding: 0 } },
                    React.createElement(StandardReader, { document, rootBlockId: 'root', useRawValue: true })
                )
            )
        )
    );
}
