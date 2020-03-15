import React from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push(`/${navigator.language}`);
  });

  return (
    <div className="h-screen flex items-center">
      <p className="text-lg flex-1 text-center">
        Please wait while we redirect you to your language...
      </p>
    </div>
  );
}
