import React from "react";
import { Github, Linkedin, Globe } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  const github = process.env.REACT_APP_GITHUB_URL || '#';
  // const email = process.env.REACT_APP_EMAIL || '';
  const linkedin = process.env.REACT_APP_LINKEDIN_URL || '#';
  const portfolio = process.env.REACT_APP_PORTFOLIO_URL || '#';

  return (
          <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0f172a] py-12 sm:py-20">
            <div className="flex flex-col items-center justify-center gap-6 sm:gap-10 px-4 sm:px-6">

        {/* Social Icons via ENV */}
              <div className="flex gap-6 sm:gap-8 text-gray-500 dark:text-gray-400">
          <a href={github} target={github !== '#' ? "_blank" : undefined} rel={github !== '#' ? "noreferrer" : undefined} className="hover:text-black dark:hover:text-white transition-colors">
                  <Github className="w-6 h-6 sm:w-7 sm:h-7" />
          </a>
          <a href={linkedin} target={linkedin !== '#' ? "_blank" : undefined} rel={linkedin !== '#' ? "noreferrer" : undefined} className="hover:text-black dark:hover:text-white transition-colors">
                  <Linkedin className="w-6 h-6 sm:w-7 sm:h-7" />
          </a>
          <a href={portfolio} target={portfolio !== '#' ? "_blank" : undefined} rel={portfolio !== '#' ? "noreferrer" : undefined} className="hover:text-black dark:hover:text-white transition-colors">
                  <Globe className="w-6 h-6 sm:w-7 sm:h-7" />
          </a>
        </div>

        {/* Copyright */}
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center tracking-wide px-4">
          © {year} Dishank Patel. All rights reserved.
        </p>

      </div>
    </footer>
  );
};

export default Footer;
