import { createContext, useState } from "react";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [rawData, setRawData] = useState([]);
  const [cleanedData, setCleanedData] = useState([]);

  return (
    <DataContext.Provider
      value={{ rawData, setRawData, cleanedData, setCleanedData }}
    >
      {children}
    </DataContext.Provider>
  );
};