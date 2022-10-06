import {createContext} from 'react';

const {Provider, Consumer} = createContext(null);

Provider.displayName = 'ShowPopoverContextProvider';

export {
    Provider as ShowPopoverContextProvider,
    Consumer as ShowPopoverContextConsumer,
};
