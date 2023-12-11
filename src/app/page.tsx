"use client";
import React, { useEffect, useRef, useState } from "react";
import { USTInput } from "./showUST";
import { AudioBar } from "./audioBar";

export default function Home() {
  // return <AudioFreqChart />;
  return (
    <div>
      <AudioBar />
      <USTInput />
    </div>
  );
}
