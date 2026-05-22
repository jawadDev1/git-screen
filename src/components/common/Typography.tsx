import React from "react";

import { cn } from "@/lib/utils";

const classNames = {
  span: "inline",
  h1: "scroll-m-20 text-2xl font-semibold  tracking-tight lg:text-5xl lg:leading-[64px] leading-[36px]",
  h2: "scroll-m-20 text-[22px] leading-[40px] lg:text-[32px] font-semibold text-primary-text lg:leading-[40px] tracking-tight transition-colors",
  h3: "scroll-m-20  text-lg leading-[26px] text-heading-text font-medium tracking-tight ",
  p: "scroll-m-20 lg:text-[16px] text-sm  tracking-tight leading-[26px] ",
  lead: "text-[16px] leading-[28px] lg:leading-[34px] lg:text-lg text-secondary-text",
  muted: "text-sm lg:text-[15px] text-light-text font-normal leading-[26px]",
  normal: "text-secondary-text",
  small: "text-sm font-normal leading-5 text-light-text",

  h5: "scroll-m-20 text-lg font-semibold tracking-tight text-neutral-800",
  h6: "scroll-m-20 text-base font-semibold tracking-tight",
  large: "text-lg font-semibold",
  xs: "text-xs font-medium leading-none text-neutral-800",
  blockquote: "mt-6 border-l-2 pl-6 italic",
  ul: "my-3 ml-6 list-disc [&>li]:mt-1",
  li: "text-md",
  before:
    "before:content-[''] before:block before:w-3/4 before:h-1 before:bg-black before:mb-0.5",
  after:
    "after:content-[''] after:block after:w-3/4 after:h-1 after:bg-black after:mt-0.5",
};

export const Typography = ({
  children,
  className,
  variant = "normal",
  before,
  after,
  ...otherProps
}: {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof classNames;
  before?: boolean;
  after?: boolean;
} & Omit<
  React.HTMLAttributes<HTMLElement>,
  "className"
>): React.JSX.Element => {
  const elementMap = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    p: "p",
    lead: "p",
    muted: "p",
    large: "div",
    small: "small",
    xs: "p",
    blockquote: "blockquote",
    ul: "ul",
    before: "div",
    after: "div",
    span: "span",
    li: "li",
    normal: "p",
  } as const;

  const Element = elementMap[variant];
  const baseClass = classNames[variant] ?? "";
  const beforeClass = before ? cn(classNames["before"], before) : "";
  const afterClass = after ? cn(classNames["after"], after) : "";

  return (
    <Element
      className={cn("relative", baseClass, beforeClass, afterClass, className)}
      {...otherProps}
    >
      {children}
    </Element>
  );
};
