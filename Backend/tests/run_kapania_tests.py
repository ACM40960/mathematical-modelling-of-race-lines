#!/usr/bin/env python3
"""
Kapania Model Testing Runner

This script runs comprehensive tests on the Kapania Two Step Algorithm implementation.
It provides both basic functionality tests and advanced parameter analysis.

Usage:
    python run_kapania_tests.py [--basic|--advanced|--all]
    
Options:
    --basic     Run basic functionality tests only
    --advanced  Run advanced parameter analysis only  
    --all       Run all tests (default)
"""

import sys
import os
import argparse
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def run_basic_tests():
    """Run basic Kapania model tests"""
    print("🧪 Running Basic Kapania Model Tests")
    print("=" * 50)
    
    try:
        from models.test_kapania_model import KapaniaModelTester
        tester = KapaniaModelTester()
        tester.run_comprehensive_test_suite()
        return True
    except Exception as e:
        print(f"❌ Basic tests failed: {str(e)}")
        return False

def run_advanced_analysis():
    """Run advanced Kapania model analysis"""
    print("🔬 Running Advanced Kapania Model Analysis")
    print("=" * 50)
    
    try:
        from models.advanced_kapania_analysis import AdvancedKapaniaAnalyzer
        analyzer = AdvancedKapaniaAnalyzer()
        analyzer.run_complete_analysis()
        return True
    except Exception as e:
        print(f"❌ Advanced analysis failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = ['numpy', 'matplotlib', 'pandas', 'scipy']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n💡 Install missing packages with:")
        print(f"   pip install {' '.join(missing_packages)}")
        return False
    
    return True

def main():
    parser = argparse.ArgumentParser(description='Run Kapania Model Tests')
    parser.add_argument('--basic', action='store_true', help='Run basic tests only')
    parser.add_argument('--advanced', action='store_true', help='Run advanced analysis only')
    parser.add_argument('--all', action='store_true', help='Run all tests (default)')
    
    args = parser.parse_args()
    
    # Default to all tests if no specific option is given
    if not (args.basic or args.advanced):
        args.all = True
    
    print("🏁 F1 Racing Lines - Kapania Model Test Suite")
    print("=" * 60)
    print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check dependencies
    print("🔍 Checking dependencies...")
    if not check_dependencies():
        sys.exit(1)
    print("✅ All dependencies available")
    print()
    
    success = True
    
    # Run basic tests
    if args.basic or args.all:
        success &= run_basic_tests()
        print()
    
    # Run advanced analysis
    if args.advanced or args.all:
        success &= run_advanced_analysis()
        print()
    
    # Final summary
    print("=" * 60)
    if success:
        print("🎉 ALL TESTS COMPLETED SUCCESSFULLY!")
        print("📊 Check the generated plots and JSON files for detailed results")
    else:
        print("❌ SOME TESTS FAILED!")
        print("🔧 Check the error messages above for debugging information")
    
    print(f"⏰ Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())