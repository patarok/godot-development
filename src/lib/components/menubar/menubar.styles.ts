import { css } from '$lib/styled-system/css';


//using bits-ui like intended. no fussing around with its functionality,
//styling via the data-attributes bits-ui suggests to use for styling.
export const menubarStyles = css({
    display: 'flex',
    gap: '1',

    // Nested selectors - target child elements
    '& [data-menubar-trigger]': {
        padding: '2',
        cursor: 'pointer',
        _hover: { bg: 'gray.100' }
    },

    '& [data-menubar-content]': {
        bg: 'white',
        border: '1px solid',
        borderColor: 'gray.200',
        borderRadius: 'md'
    },

    '& [data-menubar-item]': {
        padding: '1',
        _hover: { bg: 'gray.100' }
    }
});