// =============================================================================
//  Seed Data — Coding Challenges & Test Cases
// =============================================================================

export const SEED_CHALLENGES = [
  {
    id: 'seed_chal_001',
    title: 'Two Sum',
    slug: 'two-sum',
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

### Example 1
\`\`\`
Input:  nums = [2,7,11,15], target = 9
Output: [0,1]
\`\`\`

### Constraints
- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i] ≤ 10⁹
- Only one valid answer exists
`,
    difficulty: 'EASY' as const,
    tags: ['array', 'hash-table'],
    topics: ['arrays', 'hash-maps'],
    timeLimitMs: 2000,
    memLimitMb: 128,
    isPublished: true,
    starterCode: {
      JAVASCRIPT: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your solution here
}

// Read input
const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums = JSON.parse(lines[0]);
const target = parseInt(lines[1]);
console.log(JSON.stringify(twoSum(nums, target)));`,
      PYTHON: `import sys, json

def two_sum(nums, target):
    # Your solution here
    pass

data = sys.stdin.read().strip().split('\\n')
nums = json.loads(data[0])
target = int(data[1])
print(json.dumps(two_sum(nums, target)))`,
      JAVA: `import java.util.*;
import java.io.*;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[]{};
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        int[] nums = Arrays.stream(br.readLine().replaceAll("[\\\\[\\\\]]","").split(","))
                          .mapToInt(Integer::parseInt).toArray();
        int target = Integer.parseInt(br.readLine().trim());
        System.out.println(Arrays.toString(twoSum(nums, target)));
    }
}`,
      CPP: `#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Your solution here
    return {};
}

int main() {
    // Parse input and call twoSum
    return 0;
}`,
    },
    examples: [
      { input: '[2,7,11,15]\n9', output: '[0,1]', explanation: '2 + 7 = 9' },
      { input: '[3,2,4]\n6', output: '[1,2]', explanation: '2 + 4 = 6' },
    ],
    testCases: [
      { input: '[2,7,11,15]\n9',  expected: '[0,1]', isHidden: false, isSample: true, order: 1 },
      { input: '[3,2,4]\n6',      expected: '[1,2]', isHidden: false, isSample: true, order: 2 },
      { input: '[3,3]\n6',        expected: '[0,1]', isHidden: false, isSample: false, order: 3 },
      { input: '[1,2,3,4,5]\n9',  expected: '[3,4]', isHidden: true,  isSample: false, order: 4 },
      { input: '[-1,-2,-3,-4]\n-6', expected: '[1,3]', isHidden: true, isSample: false, order: 5 },
    ],
  },
  {
    id: 'seed_chal_002',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    description: `## Valid Parentheses

Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.

### Example 1
\`\`\`
Input:  s = "()"
Output: true
\`\`\`
`,
    difficulty: 'EASY' as const,
    tags: ['string', 'stack'],
    topics: ['stacks'],
    timeLimitMs: 2000,
    memLimitMb: 128,
    isPublished: true,
    starterCode: {
      JAVASCRIPT: `function isValid(s) {\n  // Your solution here\n}\n\nconst s = require('fs').readFileSync('/dev/stdin','utf8').trim();\nconsole.log(isValid(s).toString());`,
      PYTHON: `import sys\ndef is_valid(s):\n    pass\n\ns = sys.stdin.read().strip()\nprint(str(is_valid(s)).lower())`,
      JAVA: `import java.util.*;\npublic class Solution {\n    public static boolean isValid(String s) {\n        return false;\n    }\n    public static void main(String[] args) throws Exception {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(isValid(sc.nextLine()));\n    }\n}`,
      CPP: `#include <bits/stdc++.h>\nusing namespace std;\nbool isValid(string s) {\n    return false;\n}\nint main() {\n    string s; cin >> s;\n    cout << (isValid(s) ? "true" : "false") << endl;\n}`,
    },
    examples: [
      { input: '()', output: 'true' },
      { input: '()[]{}"', output: 'true' },
      { input: '(]', output: 'false' },
    ],
    testCases: [
      { input: '()',      expected: 'true',  isHidden: false, isSample: true,  order: 1 },
      { input: '()[]{}', expected: 'true',  isHidden: false, isSample: true,  order: 2 },
      { input: '(]',     expected: 'false', isHidden: false, isSample: true,  order: 3 },
      { input: '([)]',   expected: 'false', isHidden: true,  isSample: false, order: 4 },
      { input: '{[]}',   expected: 'true',  isHidden: true,  isSample: false, order: 5 },
    ],
  },
];
