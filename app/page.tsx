"use client";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Slider } from "@/src/components/ui/Slider";
import { cn } from "@/src/lib/utils";
import {
  GoogleMap,
  MarkerF,
  CircleF,
  Libraries,
  useJsApiLoader
} from "@react-google-maps/api";
import type { NextPage } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng
} from "use-places-autocomplete";

const Home: NextPage = () => {
  const [lat, setLat] = useState(27.672932021393862);
  const [lng, setLng] = useState(85.31184012689732);
  const [pgs, setPgs] = useState<any[]>([]);

  const mapRef = useRef<google.maps.Map | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );
  const [radius, setRadius] = useState<number>(1000);

  const libraries: Libraries = useMemo(() => ["places"], []);
  const mapCenter = useMemo(() => ({ lat: lat, lng: lng }), [lat, lng]);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: false,
      clickableIcons: true,
      scrollwheel: false
    }),
    []
  );

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    libraries: ["places"]
  });

  useEffect(() => {
    if (isLoaded && mapRef.current) {
      const map = mapRef.current;
      const service = new google.maps.places.PlacesService(map);
      placesServiceRef.current = service; // Store the PlacesService reference

      // Fetch nearby PGs
      service.nearbySearch(
        {
          location: mapCenter,
          radius: radius, // Search within a radius of 2.5km
          type: "PG"
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            setPgs(results || []); // Handle null result
          }
        }
      );
    }
  }, [isLoaded, mapCenter]);

  return (
    <div className="flex flex-col w-full justify-center gap-10 items-center">
      <div className="flex justify-center w-full items-center">
        <PlacesAutocomplete
          onAddressSelect={(address) => {
            getGeocode({ address: address }).then((results) => {
              const { lat, lng } = getLatLng(results[0]);
              setLat(lat);
              setLng(lng);
            });
          }}
        />
      </div>
      <div className="border-black border-1 flex ">
        <Slider
          defaultValue={[50]}
          max={100}
          step={1}
          className={cn("w-[60%]")}
          onChange={(value) => console.log(value)}
        />
      </div>
      {isLoaded ? (
        <GoogleMap
          options={mapOptions}
          zoom={14}
          center={mapCenter}
          mapTypeId={google.maps.MapTypeId.ROADMAP}
          mapContainerStyle={{ width: "600px", height: "600px" }}
          onLoad={(map) => {
            console.log("Map Loaded");
            mapRef.current = map;
          }}
        >
          {pgs.map((pg, idx) => (
            <MarkerF
              key={idx}
              position={{
                lat: pg.geometry.location.lat(),
                lng: pg.geometry.location.lng()
              }}
              onLoad={() => console.log("Hospital Marker Loaded")}
            />
          ))}
          <CircleF
            key={radius}
            center={mapCenter}
            radius={radius}
            onLoad={() => console.log("Circle Load...")}
            options={{
              fillColor: radius > 1000 ? "red" : "green",
              strokeColor: radius > 1000 ? "red" : "green",
              strokeOpacity: 0.8
            }}
          />
        </GoogleMap>
      ) : (
        <Skeleton className="w-[600px] h-[600px] rounded-full" />
      )}
    </div>
  );
};

const PlacesAutocomplete = ({
  onAddressSelect
}: {
  onAddressSelect?: (address: string) => void;
}) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: {
        country: "in"
      }
    },
    debounce: 300,
    cache: 86400
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string,
    libraries: ["places"]
  });

  console.log("ReadyAPI", ready, value, status, data);

  const renderSuggestions = () => {
    return data.map((suggestion) => {
      const {
        place_id,
        structured_formatting: { main_text, secondary_text },
        description
      } = suggestion;

      return (
        <li
          key={place_id}
          onClick={() => {
            setValue(description, false);
            clearSuggestions();
            onAddressSelect && onAddressSelect(description);
          }}
        >
          <strong>{main_text}</strong> <small>{secondary_text}</small>
        </li>
      );
    });
  };

  return (
    <div className="flex w-full justify-center items-center">
      <input
        value={value}
        className="p-4 w-full m-4 rounded-md border border-gray-300"
        disabled={!ready}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search places to find nearest pgs, hostels"
      />

      {status === "OK" && (
        <ul className={styles.suggestionWrapper}>{renderSuggestions()}</ul>
      )}
    </div>
  );
};

export default Home;

const styles = {
  homeWrapper: "flex justify-center items-center",
  sidebar: "mr-4 w-fit h-screen bg-gray-800",
  autocompleteWrapper: "w-full h-full",
  autocompleteInput: "w-96 mx-auto mt-32 px-4 py-3 border border-yellow-400",
  suggestionWrapper: "m-0 w-96 overflow-x-hidden list-none mx-auto px-4",
  suggestion: "p-2 bg-pink-200 rounded-md m-1 cursor-pointer"
};
