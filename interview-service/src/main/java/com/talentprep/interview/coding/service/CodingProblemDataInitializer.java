package com.talentprep.interview.coding.service;

import com.talentprep.interview.coding.entity.CodingProblem;
import com.talentprep.interview.coding.repository.CodingProblemRepository;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class CodingProblemDataInitializer implements CommandLineRunner {

    private final CodingProblemRepository problemRepository;

    @Override
    public void run(String... args) {
        try {
            log.info("Synchronizing standard coding question bank in PostgreSQL (ensuring clean starter templates)...");
            List<CodingProblem> seeds = createSeedProblems();
            int updatedCount = 0;
            int insertedCount = 0;

            for (CodingProblem seed : seeds) {
                Optional<CodingProblem> existingOpt = problemRepository.findBySlug(seed.getSlug());
                if (existingOpt.isPresent()) {
                    CodingProblem existing = existingOpt.get();
                    existing.setTitle(seed.getTitle());
                    existing.setCategory(seed.getCategory());
                    existing.setDifficulty(seed.getDifficulty());
                    existing.setDescription(seed.getDescription());
                    existing.setInputFormat(seed.getInputFormat());
                    existing.setOutputFormat(seed.getOutputFormat());
                    existing.setConstraints(seed.getConstraints());
                    existing.setStarterCode(seed.getStarterCode());
                    existing.setSampleTestCases(seed.getSampleTestCases());
                    existing.setHiddenTestCases(seed.getHiddenTestCases());
                    problemRepository.save(existing);
                    updatedCount++;
                } else {
                    problemRepository.save(seed);
                    insertedCount++;
                }
            }

            log.info("Question bank sync complete: {} updated, {} inserted.", updatedCount, insertedCount);
        } catch (Exception e) {
            log.warn("Failed to synchronize coding questions: {}", e.getMessage());
        }
    }

    private List<CodingProblem> createSeedProblems() {
        List<CodingProblem> problems = new ArrayList<>();

        // 1. Two Sum (Easy)
        Map<String, String> twoSumStarters = new HashMap<>();
        twoSumStarters.put("java", """
import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // TODO: Write your solution here
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        int target = sc.nextInt();
        int[] res = twoSum(nums, target);
        if (res.length == 2) {
            System.out.println(res[0] + " " + res[1]);
        }
    }
}
""");
        twoSumStarters.put("python", """
import sys

def two_sum(nums, target):
    # TODO: Write your solution here
    return []

if __name__ == '__main__':
    input_data = sys.stdin.read().split()
    if input_data:
        n = int(input_data[0])
        nums = [int(x) for x in input_data[1:n+1]]
        target = int(input_data[n+1])
        res = two_sum(nums, target)
        if res:
            print(f"{res[0]} {res[1]}")
""");
        twoSumStarters.put("cpp", """
#include <iostream>
#include <vector>

using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // TODO: Write your solution here
    return {};
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;
    vector<int> res = twoSum(nums, target);
    if (res.size() == 2) {
        cout << res[0] << " " << res[1] << endl;
    }
    return 0;
}
""");
        twoSumStarters.put("javascript", """
const fs = require('fs');

function twoSum(nums, target) {
    // TODO: Write your solution here
    return [];
}

const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (tokens.length >= 3) {
    const n = parseInt(tokens[0], 10);
    const nums = tokens.slice(1, n + 1).map(Number);
    const target = parseInt(tokens[n + 1], 10);
    const res = twoSum(nums, target);
    if (res.length === 2) {
        console.log(res[0] + " " + res[1]);
    }
}
""");

        List<Map<String, Object>> twoSumSample = List.of(
                Map.of("input", "4\n2 7 11 15\n9", "expectedOutput", "0 1", "description", "Standard pair at index 0 and 1"),
                Map.of("input", "3\n3 2 4\n6", "expectedOutput", "1 2", "description", "Indices 1 and 2 add up to 6")
        );

        List<Map<String, Object>> twoSumHidden = List.of(
                Map.of("input", "2\n3 3\n6", "expectedOutput", "0 1", "weight", 1),
                Map.of("input", "5\n-1 -2 -3 -4 -5\n-8", "expectedOutput", "2 4", "weight", 1),
                Map.of("input", "6\n10 20 30 40 50 60\n90", "expectedOutput", "3 4", "weight", 1)
        );

        problems.add(CodingProblem.builder()
                .slug("two-sum")
                .title("Two Sum")
                .difficulty(DifficultyLevel.EASY)
                .category("Arrays & Hash Tables")
                .description("""
### Problem Statement
Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice. You can return the answer in any order.

### Input Format
- Line 1: An integer `n`, the size of the array.
- Line 2: `n` space-separated integers representing `nums`.
- Line 3: An integer `target`.

### Output Format
- Print two space-separated integers representing the 0-based indices.

### Example 1
```
Input:
4
2 7 11 15
9

Output:
0 1
```

### Constraints
- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i] <= 10^9`
- `-10^9 <= target <= 10^9`
- Only one valid answer exists.
""")
                .inputFormat("First line n, second line n integers, third line target.")
                .outputFormat("Two space-separated 0-based indices.")
                .constraints("2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9")
                .starterCode(twoSumStarters)
                .sampleTestCases(twoSumSample)
                .hiddenTestCases(twoSumHidden)
                .build());

        // 2. Valid Palindrome (Easy)
        Map<String, String> palindromeStarters = new HashMap<>();
        palindromeStarters.put("java", """
import java.util.*;

public class Main {
    public static boolean isPalindrome(String s) {
        // TODO: Write your solution here
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(isPalindrome(s));
    }
}
""");
        palindromeStarters.put("python", """
import sys

def is_palindrome(s: str) -> bool:
    # TODO: Write your solution here
    return False

if __name__ == '__main__':
    raw = sys.stdin.read().rstrip('\\r\\n')
    print("true" if is_palindrome(raw) else "false")
""");
        palindromeStarters.put("cpp", """
#include <iostream>
#include <string>

using namespace std;

bool isPalindrome(string s) {
    // TODO: Write your solution here
    return false;
}

int main() {
    string s;
    if (getline(cin, s)) {
        cout << (isPalindrome(s) ? "true" : "false") << endl;
    }
    return 0;
}
""");
        palindromeStarters.put("javascript", """
const fs = require('fs');

function isPalindrome(s) {
    // TODO: Write your solution here
    return false;
}

const input = fs.readFileSync(0, 'utf-8').replace(/\\r?\\n$/, '');
console.log(isPalindrome(input) ? 'true' : 'false');
""");

        List<Map<String, Object>> palindromeSample = List.of(
                Map.of("input", "A man, a plan, a canal: Panama", "expectedOutput", "true", "description", "Alphanumeric letters match"),
                Map.of("input", "race a car", "expectedOutput", "false", "description", "Not a palindrome")
        );

        List<Map<String, Object>> palindromeHidden = List.of(
                Map.of("input", " ", "expectedOutput", "true", "weight", 1),
                Map.of("input", "0P", "expectedOutput", "false", "weight", 1),
                Map.of("input", "ab_a", "expectedOutput", "true", "weight", 1)
        );

        problems.add(CodingProblem.builder()
                .slug("valid-palindrome")
                .title("Valid Palindrome")
                .difficulty(DifficultyLevel.EASY)
                .category("Strings & Two Pointers")
                .description("""
### Problem Statement
A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.

### Example 1
```
Input: A man, a plan, a canal: Panama
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.
```

### Example 2
```
Input: race a car
Output: false
```

### Constraints
- `1 <= s.length <= 2 * 10^5`
- `s` consists only of printable ASCII characters.
""")
                .starterCode(palindromeStarters)
                .sampleTestCases(palindromeSample)
                .hiddenTestCases(palindromeHidden)
                .build());

        // 3. Container With Most Water (Medium)
        Map<String, String> waterStarters = new HashMap<>();
        waterStarters.put("java", """
import java.util.*;

public class Main {
    public static int maxArea(int[] height) {
        // TODO: Write your solution here
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] height = new int[n];
        for (int i = 0; i < n; i++) height[i] = sc.nextInt();
        System.out.println(maxArea(height));
    }
}
""");
        waterStarters.put("python", """
import sys

def max_area(height):
    # TODO: Write your solution here
    return 0

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        height = [int(x) for x in tokens[1:n+1]]
        print(max_area(height))
""");
        waterStarters.put("cpp", """
#include <iostream>
#include <vector>

using namespace std;

int maxArea(vector<int>& height) {
    // TODO: Write your solution here
    return 0;
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> height(n);
    for (int i = 0; i < n; i++) cin >> height[i];
    cout << maxArea(height) << endl;
    return 0;
}
""");
        waterStarters.put("javascript", """
const fs = require('fs');

function maxArea(height) {
    // TODO: Write your solution here
    return 0;
}

const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (tokens.length >= 1) {
    const n = parseInt(tokens[0], 10);
    const height = tokens.slice(1, n + 1).map(Number);
    console.log(maxArea(height));
}
""");

        List<Map<String, Object>> waterSample = List.of(
                Map.of("input", "9\n1 8 6 2 5 4 8 3 7", "expectedOutput", "49", "description", "Max water bounded by 8 and 7"),
                Map.of("input", "2\n1 1", "expectedOutput", "1", "description", "Two bars of height 1")
        );

        List<Map<String, Object>> waterHidden = List.of(
                Map.of("input", "5\n4 3 2 1 4", "expectedOutput", "16", "weight", 1),
                Map.of("input", "3\n1 2 1", "expectedOutput", "2", "weight", 1),
                Map.of("input", "7\n2 3 4 5 18 17 6", "expectedOutput", "17", "weight", 1)
        );

        problems.add(CodingProblem.builder()
                .slug("container-with-most-water")
                .title("Container With Most Water")
                .difficulty(DifficultyLevel.MEDIUM)
                .category("Two Pointers")
                .description("""
### Problem Statement
You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i-th` line are `(i, 0)` and `(i, height[i])`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

### Input Format
- Line 1: `n` (number of vertical lines)
- Line 2: `n` space-separated integers representing `height`

### Output Format
- Single integer representing maximum water capacity.

### Example
```
Input:
9
1 8 6 2 5 4 8 3 7

Output:
49
```
""")
                .starterCode(waterStarters)
                .sampleTestCases(waterSample)
                .hiddenTestCases(waterHidden)
                .build());

        // 4. Coin Change (Hard)
        Map<String, String> coinStarters = new HashMap<>();
        coinStarters.put("java", """
import java.util.*;

public class Main {
    public static int coinChange(int[] coins, int amount) {
        // TODO: Write your solution here
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] coins = new int[n];
        for (int i = 0; i < n; i++) coins[i] = sc.nextInt();
        int amount = sc.nextInt();
        System.out.println(coinChange(coins, amount));
    }
}
""");
        coinStarters.put("python", """
import sys

def coin_change(coins, amount):
    # TODO: Write your solution here
    return -1

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        coins = [int(x) for x in tokens[1:n+1]]
        amount = int(tokens[n+1])
        print(coin_change(coins, amount))
""");
        coinStarters.put("cpp", """
#include <iostream>
#include <vector>

using namespace std;

int coinChange(vector<int>& coins, int amount) {
    // TODO: Write your solution here
    return -1;
}

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> coins(n);
    for (int i = 0; i < n; i++) cin >> coins[i];
    int amount;
    cin >> amount;
    cout << coinChange(coins, amount) << endl;
    return 0;
}
""");
        coinStarters.put("javascript", """
const fs = require('fs');

function coinChange(coins, amount) {
    // TODO: Write your solution here
    return -1;
}

const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (tokens.length >= 2) {
    const n = parseInt(tokens[0], 10);
    const coins = tokens.slice(1, n + 1).map(Number);
    const amount = parseInt(tokens[n + 1], 10);
    console.log(coinChange(coins, amount));
}
""");

        List<Map<String, Object>> coinSample = List.of(
                Map.of("input", "3\n1 2 5\n11", "expectedOutput", "3", "description", "11 = 5 + 5 + 1"),
                Map.of("input", "1\n2\n3", "expectedOutput", "-1", "description", "Cannot form 3 using only 2s")
        );

        List<Map<String, Object>> coinHidden = List.of(
                Map.of("input", "1\n1\n0", "expectedOutput", "0", "weight", 1),
                Map.of("input", "3\n2 5 10\n15", "expectedOutput", "2", "weight", 1),
                Map.of("input", "4\n186 419 83 408\n6249", "expectedOutput", "20", "weight", 1)
        );

        problems.add(CodingProblem.builder()
                .slug("coin-change")
                .title("Coin Change")
                .difficulty(DifficultyLevel.HARD)
                .category("Dynamic Programming")
                .description("""
### Problem Statement
You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.

Return the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.

You may assume that you have an infinite number of each kind of coin.

### Example 1
```
Input:
3
1 2 5
11

Output:
3
Explanation: 11 = 5 + 5 + 1
```
""")
                .starterCode(coinStarters)
                .sampleTestCases(coinSample)
                .hiddenTestCases(coinHidden)
                .build());

        return problems;
    }
}
