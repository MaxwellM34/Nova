import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-nova-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Nova</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Overnight newborn care for DC, Maryland & Virginia families.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Families</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/providers" className="hover:text-gray-900 transition-colors">Find Providers</Link></li>
              <li><Link to="/sign-up?role=family" className="hover:text-gray-900 transition-colors">Create Account</Link></li>
              <li><Link to="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Providers</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/sign-up?role=provider" className="hover:text-gray-900 transition-colors">Apply to Join</Link></li>
              <li><Link to="/provider/apply" className="hover:text-gray-900 transition-colors">Provider Application</Link></li>
              <li><Link to="/provider/dashboard" className="hover:text-gray-900 transition-colors">Provider Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><span className="text-gray-400">NOVA Birth Partners</span></li>
              <li><span className="text-gray-400">DC / MD / VA</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-10 pt-6 text-sm text-gray-400 text-center">
          &copy; {new Date().getFullYear()} NOVA Birth Partners. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
