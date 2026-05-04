export const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Alfa+Slab+One&family=Titan+One&family=Pacifico&family=Pinyon+Script&family=Ballet&family=Oi&family=Lavishly+Yours&family=Imperial+Script&display=swap';

export const FONT_FAMILIES = [
    {
        key: 'MODERN_SANS',
        label: 'Modern sans',
        value: '"Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif',
    },
    {
        key: 'BOOK_SANS',
        label: 'Book sans',
        value: 'Optima, Candara, "Noto Sans", source-sans-pro, sans-serif',
    },
    {
        key: 'ORGANIC_SANS',
        label: 'Organic sans',
        value: 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif',
    },
    {
        key: 'GEOMETRIC_SANS',
        label: 'Geometric sans',
        value: 'Avenir, "Avenir Next LT Pro", Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif',
    },
    {
        key: 'HEAVY_SANS',
        label: 'Heavy sans',
        value:
            'Bahnschrift, "DIN Alternate", "Franklin Gothic Medium", "Nimbus Sans Narrow", sans-serif-condensed, sans-serif',
    },
    {
        key: 'ROUNDED_SANS',
        label: 'Rounded sans',
        value:
            'ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif',
    },
    {
        key: 'MODERN_SERIF',
        label: 'Modern serif',
        value: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif',
    },
    {
        key: 'BOOK_SERIF',
        label: 'Book serif',
        value: '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif',
    },
    /* 
    TODO: Fix Google Font rendering. These are currently commented out because they are not rendering correctly in the canvas.
    {
        key: 'INTER',
        label: 'Inter',
        value: '"Inter", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    },
    {
        key: 'POPPINS',
        label: 'Poppins',
        value: '"Poppins", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    },
    {
        key: 'ROBOTO',
        label: 'Roboto',
        value: '"Roboto", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    },
    {
        key: 'ALFA_SLAB_ONE',
        label: 'Alfa Slab One',
        value: '"Alfa Slab One", serif',
        url: 'https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap',
    },
    {
        key: 'TITAN_ONE',
        label: 'Titan One',
        value: '"Titan One", sans-serif',
        url: 'https://fonts.googleapis.com/css2?family=Titan+One&display=swap',
    },
    {
        key: 'PACIFICO',
        label: 'Pacifico',
        value: '"Pacifico", cursive',
        url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
    },
    {
        key: 'PINYON_SCRIPT',
        label: 'Pinyon Script',
        value: '"Pinyon Script", cursive',
        url: 'https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap',
    },
    {
        key: 'BALLET',
        label: 'Ballet',
        value: '"Ballet", cursive',
        url: 'https://fonts.googleapis.com/css2?family=Ballet&display=swap',
    },
    {
        key: 'OI',
        label: 'Oi',
        value: '"Oi", serif',
        url: 'https://fonts.googleapis.com/css2?family=Oi&display=swap',
    },
    {
        key: 'LAVISHLY_YOURS',
        label: 'Lavishly Yours',
        value: '"Lavishly Yours", cursive',
        url: 'https://fonts.googleapis.com/css2?family=Lavishly+Yours&display=swap',
    },
    {
        key: 'IMPERIAL_SCRIPT',
        label: 'Imperial Script',
        value: '"Imperial Script", cursive',
        url: 'https://fonts.googleapis.com/css2?family=Imperial+Script&display=swap',
    },
    */
    {
        key: 'MONOSPACE',
        label: 'Monospace',
        value: '"Nimbus Mono PS", "Courier New", "Cutive Mono", monospace',
    },
];

export const FONT_FAMILY_NAMES = [
    'MODERN_SANS',
    'BOOK_SANS',
    'ORGANIC_SANS',
    'GEOMETRIC_SANS',
    'HEAVY_SANS',
    'ROUNDED_SANS',
    'MODERN_SERIF',
    'BOOK_SERIF',
    /*
    'INTER',
    'POPPINS',
    'ROBOTO',
    'ALFA_SLAB_ONE',
    'TITAN_ONE',
    'PACIFICO',
    'PINYON_SCRIPT',
    'BALLET',
    'OI',
    'LAVISHLY_YOURS',
    'IMPERIAL_SCRIPT',
    */
    'MONOSPACE',
] as const;

export function getFontFamily(fontFamily: string | null | undefined) {
    if (!fontFamily) return FONT_FAMILIES[0].value;
    
    const font = FONT_FAMILIES.find((font) => font.key === fontFamily);
    if (font) return font.value;

    // If it's not a key, it might be a raw value (like Claude produces)
    return fontFamily;
}
