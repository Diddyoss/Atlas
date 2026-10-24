import type { FormEvent, FormHTMLAttributes } from "react";
import { navigate } from "../router";

type Props = Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & { action: string };

export default function Form({ action, ...rest }: Props) {
  return (
    <form
      {...rest}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const params = new URLSearchParams();
        new FormData(e.currentTarget).forEach((v, k) => params.set(k, String(v)));
        navigate(`${action}?${params}`);
      }}
    />
  );
}
