import React, { useState } from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import { fetchCities } from '../../api/OpenWeatherService';

const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "#1f2937", // visible dark bg
    borderColor: state.isFocused ? "#38bdf8" : "#6b7280",
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(56, 189, 248, 0.4)"
      : "none",
    minHeight: "48px",
    borderRadius: "8px",
    "&:hover": {
      borderColor: "#9ca3af",
    },
  }),

  input: (base) => ({
    ...base,
    color: "#ffffff",
  }),

  placeholder: (base) => ({
    ...base,
    color: "#d1d5db",
  }),

  singleValue: (base) => ({
    ...base,
    color: "#ffffff",
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "#374151"
      : state.isSelected
      ? "#4b5563"
      : "#1f2937",
    color: "#ffffff",
    cursor: "pointer",
  }),
};

const Search = ({ onSearchChange }) => {
  const [searchValue, setSearchValue] = useState(null);

  const loadOptions = async (inputValue) => {
    const citiesList = await fetchCities(inputValue);

    return {
      options: citiesList.data.map((city) => {
        return {
          value: `${city.latitude} ${city.longitude}`,
          label: `${city.name}, ${city.countryCode}`,
        };
      }),
    };
  };

  const onChangeHandler = (enteredData) => {
    setSearchValue(enteredData);
    onSearchChange(enteredData);
  };

  return (
    <AsyncPaginate
      placeholder="Search for cities"
      debounceTimeout={600}
      value={searchValue}
      onChange={onChangeHandler}
      loadOptions={loadOptions}
      styles={customStyles}
    />
  );
};

export default Search;
